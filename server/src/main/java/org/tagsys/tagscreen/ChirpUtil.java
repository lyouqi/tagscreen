package org.tagsys.tagscreen;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.io.Writer;
import java.util.Arrays;

import javax.naming.spi.DirStateFactory.Result;

import org.apache.commons.lang.ArrayUtils;
import org.apache.commons.math3.complex.Complex;
import org.apache.commons.math3.transform.DftNormalization;
import org.apache.commons.math3.transform.FastFourierTransformer;
import org.apache.commons.math3.transform.TransformType;

public class ChirpUtil {
	
	public static final int Fs = 44100;
	public static final int F1 = 18000;
	public static final int F2 = 20000;
	
	public static final double PREAMBLE_DURATION = 0.09;
	public static final double SYMBOLE_DURATION = 0.02;
	public static final double GAUD_DURATION = 0.03;
	
	public static FastFourierTransformer fft;
	
	public static double[] PREAMBLE;			
	public static double[] SYMBOLE_0;
	public static double[] SYMBOLE_1;
	public static double[] GUAD;
	
	static{
		
		fft =  new FastFourierTransformer(DftNormalization.STANDARD);
		
		PREAMBLE = chirp(F1,F2, Fs, PREAMBLE_DURATION);
	
		SYMBOLE_0 = chirp(F1,F2, Fs, SYMBOLE_DURATION);
		
		SYMBOLE_1 = chirp(F2,F1, Fs, SYMBOLE_DURATION);
		
		GUAD = new double[(int)(GAUD_DURATION*Fs)];
		
		Arrays.fill(GUAD, 0.0);
		
	}
	

	
	
	
	public static double[] chirp(int f1, int f2, int fs, double duration){
		
		double k = (f2-f1)/duration;
		
		double ts = 1.0/fs;
		int length = (int)Math.ceil(duration*fs);
		double[] result = new double[length];
		for(int i=0;i<length;i++){
			double t = i*ts;
			double angle = 2*Math.PI*f1*t + Math.PI*k*t*t;
			result[i]=Math.cos(angle);
		}
		
		return result;
	}
	
	
	public static Correlation seekPreamable(double[] signal){
		
		MathUtil.normalize(signal);
	
		signal = MathUtil.pad(signal);
		Complex[] transformedSignal = fft.transform(signal, TransformType.FORWARD);
		double[] preamble = MathUtil.pad(PREAMBLE, signal.length);
		Complex[] transformedPreamble = fft.transform(preamble, TransformType.FORWARD);
		Complex[] conjTransFormedPreamble = MathUtil.conj(transformedPreamble);
		Complex[] multiply = MathUtil.multiply(transformedSignal, conjTransFormedPreamble);
		Complex[] xcor = fft.transform(multiply, TransformType.INVERSE);
		
		return new Correlation(xcor);
	}
	
	public static int crc16(String input){
		int[] table = new int[]{
				 0x0000, 0xc0c1, 0xc181, 0x0140, 0xc301, 0x03c0, 0x0280, 0xc241,
		         0xc601, 0x06c0, 0x0780, 0xc741, 0x0500, 0xc5c1, 0xc481, 0x0440,
		         0xcc01, 0x0cc0, 0x0d80, 0xcd41, 0x0f00, 0xcfc1, 0xce81, 0x0e40,
		         0x0a00, 0xcac1, 0xcb81, 0x0b40, 0xc901, 0x09c0, 0x0880, 0xc841,
		         0xd801, 0x18c0, 0x1980, 0xd941, 0x1b00, 0xdbc1, 0xda81, 0x1a40,
		         0x1e00, 0xdec1, 0xdf81, 0x1f40, 0xdd01, 0x1dc0, 0x1c80, 0xdc41,
		         0x1400, 0xd4c1, 0xd581, 0x1540, 0xd701, 0x17c0, 0x1680, 0xd641,
		         0xd201, 0x12c0, 0x1380, 0xd341, 0x1100, 0xd1c1, 0xd081, 0x1040,
		         0xf001, 0x30c0, 0x3180, 0xf141, 0x3300, 0xf3c1, 0xf281, 0x3240,
		         0x3600, 0xf6c1, 0xf781, 0x3740, 0xf501, 0x35c0, 0x3480, 0xf441,
		         0x3c00, 0xfcc1, 0xfd81, 0x3d40, 0xff01, 0x3fc0, 0x3e80, 0xfe41,
		         0xfa01, 0x3ac0, 0x3b80, 0xfb41, 0x3900, 0xf9c1, 0xf881, 0x3840,
		         0x2800, 0xe8c1, 0xe981, 0x2940, 0xeb01, 0x2bc0, 0x2a80, 0xea41,
		         0xee01, 0x2ec0, 0x2f80, 0xef41, 0x2d00, 0xedc1, 0xec81, 0x2c40,
		         0xe401, 0x24c0, 0x2580, 0xe541, 0x2700, 0xe7c1, 0xe681, 0x2640,
		         0x2200, 0xe2c1, 0xe381, 0x2340, 0xe101, 0x21c0, 0x2080, 0xe041,
		         0xa001, 0x60c0, 0x6180, 0xa141, 0x6300, 0xa3c1, 0xa281, 0x6240,
		         0x6600, 0xa6c1, 0xa781, 0x6740, 0xa501, 0x65c0, 0x6480, 0xa441,
		         0x6c00, 0xacc1, 0xad81, 0x6d40, 0xaf01, 0x6fc0, 0x6e80, 0xae41,
		         0xaa01, 0x6ac0, 0x6b80, 0xab41, 0x6900, 0xa9c1, 0xa881, 0x6840,
		         0x7800, 0xb8c1, 0xb981, 0x7940, 0xbb01, 0x7bc0, 0x7a80, 0xba41,
		         0xbe01, 0x7ec0, 0x7f80, 0xbf41, 0x7d00, 0xbdc1, 0xbc81, 0x7c40,
		         0xb401, 0x74c0, 0x7580, 0xb541, 0x7700, 0xb7c1, 0xb681, 0x7640,
		         0x7200, 0xb2c1, 0xb381, 0x7340, 0xb101, 0x71c0, 0x7080, 0xb041,
		         0x5000, 0x90c1, 0x9181, 0x5140, 0x9301, 0x53c0, 0x5280, 0x9241,
		         0x9601, 0x56c0, 0x5780, 0x9741, 0x5500, 0x95c1, 0x9481, 0x5440,
		         0x9c01, 0x5cc0, 0x5d80, 0x9d41, 0x5f00, 0x9fc1, 0x9e81, 0x5e40,
		         0x5a00, 0x9ac1, 0x9b81, 0x5b40, 0x9901, 0x59c0, 0x5880, 0x9841,
		         0x8801, 0x48c0, 0x4980, 0x8941, 0x4b00, 0x8bc1, 0x8a81, 0x4a40,
		         0x4e00, 0x8ec1, 0x8f81, 0x4f40, 0x8d01, 0x4dc0, 0x4c80, 0x8c41,
		         0x4400, 0x84c1, 0x8581, 0x4540, 0x8701, 0x47c0, 0x4680, 0x8641,
		         0x8201, 0x42c0, 0x4380, 0x8341, 0x4100, 0x81c1, 0x8081, 0x4040};

		
		int result = 0;
		for(int i=0;i<input.length();i+=4){
			int temp = Integer.parseInt(input.substring(i, i+4),2);
			temp = temp^result;
			temp = temp&255;
			temp = table[temp];
			temp = temp^(result>>8);
			temp = temp&65535;
			result = temp;
		}

		return result;
		
	}
	
	public static String toBinaryString(int number, int length){
		String result = new String(Integer.toBinaryString(number));
		while(result.length()<length){
			result = '0'+result;
		}
		return result;
	}
	
	public static String createContext(int seconds, int contentId){
		
		String content = "";
		for(int i=1;i<=seconds;i++){
			content = toBinaryString(i,14)+toBinaryString(contentId,14);
			content = content + toBinaryString(crc16(content),16);
		}
		return content;
	}
	
	private static void write(Writer writer, double[] data)throws Exception{
		for(int i=0;i<data.length;i++){
			writer.write(data[i]+",");
		}
	}
	
	public static void createMarkers(int contentId, int seconds)throws Exception{
		
		File file = new File("/Users/Young/Dropbox/Research/Papers/TagScreen/code/Makers/"+contentId+".txt");
		if(!file.exists()) file.createNewFile();
		BufferedWriter bw = new BufferedWriter(new FileWriter(file));
		for(int i=0;i<seconds;i++){
			write(bw, PREAMBLE);
			String context = createContext(i+1,contentId);
			for(int j=0;j<context.length();j++){
				if(context.charAt(j)=='0'){
					write(bw,SYMBOLE_0);
				}else{
					write(bw,SYMBOLE_1);
				}
			}
			write(bw,GUAD);
		}
		bw.flush();
		bw.close();
	}
	
	public static void main(String[] args) throws Exception{
			
		createMarkers(100,5*60);
		
//		long start = System.nanoTime();
//		
//		double[] prefix = new double[100000];
//		for(int i=0;i<prefix.length;i++){
//			prefix[i] = Math.random();
//		}
//				
//		double[] signal = ArrayUtils.addAll(prefix, PREAMBLE);
//		
//		Correlation cor = seekPreamable(signal);
//		
//		long end = System.nanoTime();
//			
//		System.out.println(cor.getIndex());
//		System.out.println(cor.getMax());
//		
//		System.out.println(end-start);
		
		
		
	}
	
}
